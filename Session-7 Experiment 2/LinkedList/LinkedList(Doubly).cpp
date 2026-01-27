struct Node{
    int data;
    Node*next;
    Node*previous;

    Node(int val){
        previous=NULL;
        data=val;
        next=NULL;
    }
};

Node* head = NULL;
void insert(int val){
    Node* now = new Node(val);
    if(head == NULL){
        head = now;
        return;
    }
    Node* current = head;
    while(current->next != NULL){
        current = current->next;
    }
    current->next = now;
    now->previous = current;
}

void display(){
    Node* current = head;
    while(current != NULL){
        cout << current->data << " ";
        current = current->next;
    }
    cout << endl;
}

void deleteNode(int val){
    if(head == NULL) return;
    if(head->data == val){
        Node* temp= head;
        head = head->next;
        if(head != NULL){
            head->previous = NULL;
        }
        delete temp;
        return;
    }

    Node* current = head;
    while(current != NULL){
        if(current->data == val){
            if(current->next != NULL){
                current->next->previous = current->previous;
            }
            if(current->previous != NULL){
                current->previous->next = current->next;
            }
            delete current;
            return;
        }
        current = current->next;
    }
}

int main(){
    insert(10);
    insert(20);
    insert(30);
    display();
    deleteNode(20);
    display();
    return 0;
}