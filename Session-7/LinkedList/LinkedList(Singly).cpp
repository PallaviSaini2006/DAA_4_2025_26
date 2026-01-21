
struct Node{
    int data;
    Node*next;

    Node(int val){
        data=val;
        next=NULL;
    }
}

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
        delete temp;
        return;
    }

    Node* current = head;
    while(current->next != NULL){
        if(current->next->data == val){
            Node* temp = current->next;
            current->next = current->next->next;
            delete temp;
            return;
        }
    }
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
